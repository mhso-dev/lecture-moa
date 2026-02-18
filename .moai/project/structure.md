# Project Structure: lecture-moa

## Overview

lecture-moa uses a monorepo architecture managed with pnpm workspaces and Turborepo. The project is organized into four primary packages: a Next.js frontend application, a Node.js backend API server, a Python FastAPI AI microservice, and a shared package for types, utilities, and constants used by the TypeScript applications.

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
│   │   │   ├── api/                  # Next.js API routes (auth, BFF)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/               # React components
│   │   │   ├── auth/                 # Login, Register forms
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
│   │   ├── lib/                      # Client-side utilities
│   │   │   ├── api.ts                # API client configuration
│   │   │   ├── auth.ts               # Auth utilities
│   │   │   └── websocket.ts          # WebSocket client
│   │   ├── providers/                # React context providers
│   │   ├── styles/                   # Global styles and themes
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── api/                          # Node.js backend API server
│   │   ├── src/
│   │   │   ├── modules/              # Feature modules (domain-driven)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   └── auth.middleware.ts
│   │   │   │   ├── course/
│   │   │   │   │   ├── course.controller.ts
│   │   │   │   │   ├── course.service.ts
│   │   │   │   │   └── course.routes.ts
│   │   │   │   ├── material/
│   │   │   │   │   ├── material.controller.ts
│   │   │   │   │   ├── material.service.ts
│   │   │   │   │   └── material.routes.ts
│   │   │   │   ├── qa/
│   │   │   │   │   ├── qa.controller.ts
│   │   │   │   │   ├── qa.service.ts
│   │   │   │   │   └── qa.routes.ts
│   │   │   │   ├── memo/
│   │   │   │   │   ├── memo.controller.ts
│   │   │   │   │   ├── memo.service.ts
│   │   │   │   │   └── memo.routes.ts
│   │   │   │   ├── quiz/
│   │   │   │   │   ├── quiz.controller.ts
│   │   │   │   │   ├── quiz.service.ts
│   │   │   │   │   └── quiz.routes.ts
│   │   │   │   ├── team/
│   │   │   │   │   ├── team.controller.ts
│   │   │   │   │   ├── team.service.ts
│   │   │   │   │   └── team.routes.ts
│   │   │   │   └── dashboard/
│   │   │   │       ├── dashboard.controller.ts
│   │   │   │       ├── dashboard.service.ts
│   │   │   │       └── dashboard.routes.ts
│   │   │   ├── common/               # Shared backend utilities
│   │   │   │   ├── middleware/        # Global middleware
│   │   │   │   ├── guards/           # Authorization guards
│   │   │   │   ├── decorators/       # Custom decorators
│   │   │   │   ├── filters/          # Error filters
│   │   │   │   └── utils/            # Utility functions
│   │   │   ├── config/               # Configuration management
│   │   │   │   ├── database.ts
│   │   │   │   └── auth.ts
│   │   │   ├── websocket/            # WebSocket server
│   │   │   │   ├── gateway.ts
│   │   │   │   └── handlers/
│   │   │   ├── app.ts                # Application entry point
│   │   │   └── server.ts             # Server bootstrap
│   │   ├── prisma/                   # Prisma ORM
│   │   │   ├── schema.prisma         # Database schema
│   │   │   ├── migrations/           # Database migrations
│   │   │   └── seed.ts               # Seed data
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
│       │   │   └── events.ts         # WebSocket event names
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

### apps/api/ - Backend API Server
The Node.js backend organized into feature modules following a domain-driven structure. Each module contains its own controller (HTTP handlers), service (business logic), and routes (endpoint definitions). For AI-powered features (quiz generation, Q&A assistant, material analysis), the backend forwards requests to the Python AI service via internal REST API calls. The websocket directory manages real-time communication for Q&A notifications and team collaboration.

### apps/ai/ - AI Service
A separate Python FastAPI microservice responsible for all LLM-powered features. Contains LangChain chain definitions for quiz generation, Q&A assistance, and material analysis. Organized with FastAPI routers for endpoint handling, a chains directory for LangChain orchestration logic, prompt templates for LLM interactions, Pydantic models for request/response validation, and a services layer for business logic. Communicates exclusively with the Node.js backend via REST API. Deployed as its own Docker container for independent scaling and development.

### packages/shared/ - Shared Package
Contains TypeScript types, constants, validation schemas, and utilities shared between frontend and backend. Using Zod for validation schemas ensures consistent validation rules on both client and server. The types directory provides a single source of truth for all data structures used across the application.

### docs/ - Documentation
A Nextra-based documentation site for developer and user documentation. Organized with file-system routing for automatic navigation generation.

## Module Organization Strategy

### Domain-Driven Modules
Each feature domain (auth, course, material, qa, memo, quiz, team, dashboard) is encapsulated in its own module with clear boundaries. AI/LLM features are handled by the separate Python AI service in apps/ai/. This enables:
- Independent development and testing of each feature
- Clear ownership and responsibility boundaries
- Easy addition of new features without affecting existing ones
- Straightforward navigation for developers

### Layered Architecture Within Modules
Each module follows a consistent internal structure:
- **Controller**: Handles HTTP request/response, input validation, and delegates to service
- **Service**: Contains business logic, interacts with database and external services
- **Routes**: Defines API endpoints and applies middleware

### Shared Code Strategy
Code shared across modules lives in two places:
- **packages/shared/**: For code shared between frontend and backend (types, validators, constants)
- **apps/api/src/common/**: For code shared across backend modules only (middleware, guards, utilities)

### WebSocket Architecture
Real-time features are centralized in the websocket directory with event handlers organized by feature domain. Event names are defined as constants in the shared package to ensure consistency between client and server.
