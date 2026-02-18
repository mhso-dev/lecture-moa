# Technology Stack: lecture-moa

## Overview

lecture-moa is built as a TypeScript monorepo with a Next.js frontend, a Node.js backend API, a Python FastAPI AI microservice, and a shared types/utilities package. The stack prioritizes developer experience, type safety, real-time capabilities, and extensibility for AI features through a dedicated Python service.

## Frontend

### Next.js 15 (App Router)
**Rationale**: Next.js provides server-side rendering for SEO and initial load performance, file-system-based routing for intuitive page organization, React Server Components for optimized data fetching, and built-in API routes useful for authentication callbacks and backend-for-frontend patterns.

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

### State Management: Zustand
**Rationale**: Lightweight, TypeScript-friendly state management with minimal boilerplate. Suitable for managing client-side state such as active highlights, popup visibility, memo drafts, and WebSocket connection state. Simpler than Redux for the scope of this application.

### Data Fetching: TanStack Query (React Query) v5
**Rationale**: Provides caching, background refetching, optimistic updates, and pagination support for API interactions. Reduces boilerplate compared to manual fetch management and integrates well with the real-time WebSocket updates.

### Form Handling: React Hook Form + Zod
**Rationale**: React Hook Form provides performant form management with minimal re-renders. Zod schemas from the shared package are reused for client-side validation, ensuring consistency with server-side validation.

## Backend

### Node.js with TypeScript
**Rationale**: Full-stack TypeScript enables shared types and validation between frontend and backend. Node.js provides excellent async I/O performance for the real-time features and LLM API calls.

### Fastify
**Rationale**: High-performance HTTP framework with built-in TypeScript support, schema-based validation, plugin architecture, and excellent developer experience. Faster than Express with better TypeScript integration. Supports WebSocket through @fastify/websocket plugin.

### Prisma ORM
**Rationale**: Type-safe database access with auto-generated TypeScript types from the schema. Provides an intuitive schema definition language, migration management, and a powerful query builder. The generated types integrate well with the shared types package.

### Authentication: NextAuth.js (Auth.js) v5
**Rationale**: Handles authentication flows including credential-based login, session management, and JWT/session token handling. Supports role-based access control through custom session callbacks. Runs on the Next.js side with session data accessible to the backend API via shared JWT tokens.

Alternative consideration: Custom JWT implementation with jose library if more control is needed over the authentication flow.

## Database

### PostgreSQL 16
**Rationale**: Robust relational database with excellent support for complex queries, full-text search (useful for searching lecture materials and Q&A), JSON/JSONB columns (useful for flexible memo content and quiz configurations), and strong data integrity through foreign keys and constraints.

Key features leveraged:
- Full-text search for lecture material and Q&A search
- JSONB columns for flexible quiz question formats and memo metadata
- Row-level security potential for multi-tenant course isolation
- Excellent Prisma ORM support

### Redis
**Rationale**: In-memory data store used for:
- Session storage and caching
- WebSocket pub/sub for scaling real-time features across multiple server instances
- Rate limiting for LLM API calls
- Caching frequently accessed lecture materials and dashboard aggregations

## Real-Time Communication

### WebSocket via @fastify/websocket
**Rationale**: Native WebSocket support through Fastify's plugin system. Provides bidirectional communication for:
- Q&A notification delivery to instructors when new questions are posted
- Live comment and thread updates for students viewing the same material
- Team collaboration synchronization for shared memo editing
- Dashboard data live refresh

### Socket.io (Alternative)
If more advanced features are needed (automatic reconnection, room management, fallback to long-polling), Socket.io can replace the native WebSocket implementation. It adds complexity but provides a more robust client library.

## AI Service

### Python FastAPI Microservice
**Rationale**: AI/ML features are served by a separate Python FastAPI microservice rather than being embedded in the Node.js backend. Python provides access to the richest AI/ML ecosystem, including LangChain, Hugging Face, and other advanced libraries. This separation enables independent scaling, deployment, and development of AI features without impacting the core application server.

Key architecture decisions:
- **Separate process**: The AI service runs as its own Docker container, communicating with the Node.js backend via REST API
- **Python 3.13+**: Leverages the latest Python features and performance improvements
- **FastAPI**: High-performance async web framework with automatic OpenAPI documentation, request validation via Pydantic, and native async/await support
- **LangChain (Python)**: The Python version of LangChain provides the most comprehensive LLM orchestration capabilities, including chain composition, prompt management, output parsers, and memory management

### Use Cases
- **Quiz Generation**: Takes lecture material as input, generates quiz questions with answers
- **Q&A Assistant**: Provides initial AI-powered answers to student questions based on lecture content
- **Material Analyzer**: Summarizes lecture content, extracts key concepts, suggests study focus areas

### LLM Provider: OpenAI API (default, configurable)
**Rationale**: Widely available, well-documented, and supported by LangChain. The provider is abstracted through LangChain so it can be swapped for Anthropic Claude, Google Gemini, or local models without code changes.

### Communication Pattern
The Node.js backend acts as a gateway for AI features, forwarding requests to the Python AI service via internal REST API calls. This keeps the frontend unaware of the microservice architecture and allows the backend to handle authentication, rate limiting, and request validation before forwarding to the AI service.

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
**Rationale**: Strict type checking across the entire codebase with shared type definitions. Project references in tsconfig enable efficient incremental compilation across packages.

### ESLint + Prettier
**Rationale**: ESLint for code quality rules and Prettier for consistent formatting. Shared configuration at the root level ensures consistency across all packages.

### Vitest
**Rationale**: Fast, TypeScript-native testing framework compatible with the Vite ecosystem. Provides Jest-compatible API with better performance and ESM support. Used for both frontend component testing and backend unit/integration testing.

### Playwright
**Rationale**: End-to-end testing framework for testing critical user flows including the text highlighting and Q&A popup interaction, which requires precise DOM interaction testing.

## Infrastructure and Deployment

### Docker + Docker Compose
**Rationale**: Containerization for consistent development and deployment environments. Docker Compose orchestrates the multi-service architecture: Node.js backend, Python AI service, PostgreSQL, and Redis containers for local development. Each service has its own Dockerfile for independent building and deployment.

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
- next-auth: Authentication

### Backend (apps/api)
- fastify: HTTP framework
- @fastify/websocket: WebSocket support
- @fastify/cors: CORS handling
- @fastify/rate-limit: Rate limiting
- @prisma/client: Database client
- prisma: ORM CLI and migration tool
- ioredis: Redis client
- zod: Validation (shared)
- jose: JWT utilities

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
- docker-compose: Local environment orchestration

## Development Environment Requirements

- Node.js: 20.x LTS or later
- pnpm: 9.x or later
- Python: 3.13 or later
- uv or pip: Python package management (uv recommended for speed)
- PostgreSQL: 16.x (via Docker or local installation)
- Redis: 7.x (via Docker or local installation)
- Docker: 24.x or later (recommended for all services)
- Git: 2.x or later
- OS: macOS, Linux, or Windows (WSL2 recommended)
- LLM API Key: OpenAI API key (or alternative provider key) for AI features
