# lecture-moa

An educational platform designed to enhance the lecture experience for instructors and students. Instructors upload lecture materials in Markdown format, while students study individually or collaboratively in teams. The platform features interactive Q&A through inline text highlighting, team-based study management, LLM-powered quiz generation, and comprehensive dashboards for tracking learning activities.

## Key Features

- **Authentication and Access Control** -- Role-based system supporting Instructor and Student roles with registration, login, session management, and permission enforcement.

- **Lecture Material Management** -- Upload and organize Markdown-based lecture materials with support for code blocks, mathematical expressions, images, and embedded media.

- **Interactive Q&A System** -- Highlight any text within lecture materials to open an inline popup, write questions in Markdown, and receive answers from instructors or an AI assistant. All Q&A threads remain anchored to the original text.

- **Team and Individual Memos** -- Create personal study notes or form team study groups for collaborative note-taking with shared memos and version tracking.

- **Quiz System with LLM Generation** -- Instructors create quizzes manually or generate them automatically from lecture content using LangChain-based LLM integration. Supports multiple question types and automated grading.

- **Comprehensive Dashboards** -- Instructor analytics for material engagement and student progress. Student dashboards for tracking study time, quiz scores, and Q&A participation. Team activity and collaboration metrics.

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| Next.js 15 (App Router) | Server-side rendering, file-system routing, React Server Components |
| React 19 | UI library with concurrent features |
| Tailwind CSS 4 | Utility-first CSS framework |
| shadcn/ui | Accessible UI component library (Radix UI primitives) |
| Zustand | Lightweight state management |
| TanStack Query v5 | Data fetching with caching and optimistic updates |
| react-markdown + remark/rehype | Markdown rendering with GFM, math, and syntax highlighting |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Fastify | High-performance HTTP framework with TypeScript support |
| Prisma ORM | Type-safe database access with auto-generated types |
| NextAuth.js v5 | Authentication and session management |
| @fastify/websocket | Real-time communication for Q&A and collaboration |

### AI Service

| Technology | Purpose |
|---|---|
| Python FastAPI | Async web framework for AI/ML features |
| LangChain | LLM orchestration for quiz generation, Q&A assistance, material analysis |
| OpenAI API | Default LLM provider (swappable via LangChain abstraction) |

### Infrastructure

| Technology | Purpose |
|---|---|
| PostgreSQL 16 | Primary database with full-text search and JSONB support |
| Redis | Session storage, caching, WebSocket pub/sub, rate limiting |
| Docker + Docker Compose | Containerized development and deployment |
| pnpm + Turborepo | Monorepo management with parallel builds and caching |
| Vitest | Unit and integration testing |
| Playwright | End-to-end testing |

## Project Structure (Planned)

```
lecture-moa/
├── apps/
│   ├── web/                    # Next.js frontend (App Router)
│   │   ├── app/                # Pages and layouts
│   │   ├── components/         # React components by domain
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Client-side utilities
│   │   └── providers/          # React context providers
│   │
│   ├── api/                    # Node.js + Fastify backend
│   │   ├── src/modules/        # Domain modules (auth, course, material, qa, memo, quiz, team, dashboard)
│   │   ├── src/websocket/      # WebSocket server and handlers
│   │   └── prisma/             # Database schema and migrations
│   │
│   └── ai/                     # Python FastAPI AI microservice
│       ├── app/routers/        # API route handlers
│       ├── app/chains/         # LangChain chain definitions
│       └── app/prompts/        # LLM prompt templates
│
├── packages/
│   └── shared/                 # Shared TypeScript types, validators, constants
│
├── design/                     # UI/UX design artifacts (.pen files)
│   ├── design-system/          # Colors, typography, spacing, icons, components
│   ├── screens/                # Screen designs by domain
│   └── navigation/             # Navigation patterns (desktop, tablet, mobile)
│
└── docs/                       # Documentation site (Nextra)
```

## Current Status

This project is in the **active development phase**. The frontend foundation has been implemented.

### Completed

- **Product definition** -- Core features, target audience, use cases, and non-functional requirements documented.
- **Technology stack** -- Full-stack architecture decisions finalized with rationale for each choice.
- **Project structure** -- Monorepo layout designed with domain-driven module organization.
- **SPEC-UI-001: Frontend Design System** -- Complete UI/UX specification created.
- **45 screen designs** -- All application screens designed as .pen files:
  - 6 design system foundations (colors, typography, spacing, icons, components, and patterns)
  - 5 authentication screens (landing, login, register, password reset, profile settings)
  - 4 course screens (list, detail, create, settings)
  - 4 material screens (list, viewer, editor, upload)
  - 3 Q&A screens + inline popup (list, detail, highlight popup)
  - 3 memo screens (list, editor, and shared views)
  - 6 quiz screens (list, create, taking, results, manage, LLM generate)
  - 4 team screens (list, detail, create, team memo)
  - 3 dashboard screens (instructor, student, team)
  - 4 common screens (search results, notifications, 404, 500, loading states)
  - 3 navigation patterns (desktop sidebar, tablet sidebar, mobile bottom tab)
- **SPEC-FE-001: Next.js Frontend Foundation** -- Complete frontend scaffolding implemented (2026-02-19):
  - Monorepo setup with pnpm workspaces and Turborepo
  - Design token system (CSS variables, Tailwind CSS 4)
  - Responsive layout and navigation (Sidebar, BottomTab, ContentLayout)
  - 18 shadcn/ui components
  - Provider infrastructure (Theme, TanStack Query, Auth)
  - Shared TypeScript package with types, validators, and constants

### SPEC Implementation Status

| SPEC | Title | Status |
|------|-------|--------|
| SPEC-UI-001 | Frontend Design System | Completed |
| SPEC-FE-001 | Next.js Frontend Foundation | Completed (2026-02-19) |
| SPEC-FE-002 | Authentication Flow | Planned |
| SPEC-FE-003 | Dashboard Screen | Planned |
| SPEC-FE-004 | Course Screens | Planned |

### Next Steps

- Build authentication flow (SPEC-FE-002): login, register, session management
- Implement dashboard screens (SPEC-FE-003)
- Implement course listing and detail screens (SPEC-FE-004)
- Develop the backend API modules (SPEC-BE-XXX)
- Set up the Python AI service with LangChain (SPEC-AI-XXX)

## Getting Started

### Prerequisites

- Node.js 20.x LTS or later
- pnpm 9.x or later
- Python 3.13 or later (for AI service, when implemented)
- PostgreSQL 16.x (when backend is implemented)
- Redis 7.x (when backend is implemented)
- Docker 24.x or later (recommended)
- An OpenAI API key (for AI features, when implemented)

### Installation

```bash
pnpm install
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run specific app
pnpm --filter @lecture-moa/web dev
```

### Environment Setup

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

## License

TBD
